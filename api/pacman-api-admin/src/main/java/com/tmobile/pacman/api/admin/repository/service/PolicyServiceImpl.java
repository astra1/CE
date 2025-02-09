package com.tmobile.pacman.api.admin.repository.service;

import static com.tmobile.pacman.api.admin.common.AdminConstants.CLOUDWATCH_RULE_DISABLE_FAILURE;
import static com.tmobile.pacman.api.admin.common.AdminConstants.CLOUDWATCH_RULE_ENABLE_FAILURE;
import static com.tmobile.pacman.api.admin.common.AdminConstants.DELIMITER;
import static com.tmobile.pacman.api.admin.common.AdminConstants.DELIMITER_AT;
import static com.tmobile.pacman.api.admin.common.AdminConstants.DELIMITER_DOT_REGEX;
import static com.tmobile.pacman.api.admin.common.AdminConstants.EMAIL_REGEX_PATTERN;
import static com.tmobile.pacman.api.admin.common.AdminConstants.INVALID_USER_ATTRIBUTES;
import static com.tmobile.pacman.api.admin.common.AdminConstants.UNEXPECTED_ERROR_OCCURRED;
import static com.tmobile.pacman.api.admin.util.AdminUtils.addDays;

import java.nio.ByteBuffer;
import java.text.ParseException;
import java.util.Collection;
import java.util.Date;
import java.util.List;
import java.util.Map;
import java.util.Objects;
import java.util.Optional;
import java.util.UUID;
import java.util.regex.Pattern;
import java.util.stream.Collectors;

import javax.transaction.Transactional;

import com.tmobile.pacman.api.admin.repository.*;
import com.tmobile.pacman.api.admin.repository.model.*;
import org.apache.commons.lang.StringUtils;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import com.amazonaws.services.cloudwatchevents.model.DisableRuleRequest;
import com.amazonaws.services.cloudwatchevents.model.DisableRuleResult;
import com.amazonaws.services.cloudwatchevents.model.EnableRuleRequest;
import com.amazonaws.services.cloudwatchevents.model.EnableRuleResult;
import com.amazonaws.services.cloudwatchevents.model.PutRuleRequest;
import com.amazonaws.services.cloudwatchevents.model.PutRuleResult;
import com.amazonaws.services.cloudwatchevents.model.PutTargetsRequest;
import com.amazonaws.services.cloudwatchevents.model.PutTargetsResult;
import com.amazonaws.services.cloudwatchevents.model.RuleState;
import com.amazonaws.services.cloudwatchevents.model.Target;
import com.amazonaws.services.eventbridge.model.DescribeRuleRequest;
import com.amazonaws.services.eventbridge.model.DescribeRuleResult;
import com.amazonaws.services.lambda.AWSLambda;
import com.amazonaws.services.lambda.model.AddPermissionRequest;
import com.amazonaws.services.lambda.model.GetPolicyRequest;
import com.amazonaws.services.lambda.model.InvokeRequest;
import com.amazonaws.services.lambda.model.InvokeResult;
import com.amazonaws.services.lambda.model.ResourceNotFoundException;
import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.google.common.collect.Lists;
import com.google.common.collect.Maps;
import com.google.gson.JsonObject;
import com.tmobile.pacman.api.admin.common.AdminConstants;
import com.tmobile.pacman.api.admin.config.PacmanConfiguration;
import com.tmobile.pacman.api.admin.domain.CognitoUserResponse;
import com.tmobile.pacman.api.admin.domain.CreateUpdatePolicyDetails;
import com.tmobile.pacman.api.admin.domain.EnableDisablePolicy;
import com.tmobile.pacman.api.admin.domain.PolicyProjection;
import com.tmobile.pacman.api.admin.exceptions.PacManException;
import com.tmobile.pacman.api.admin.service.AmazonClientBuilderService;
import com.tmobile.pacman.api.admin.service.AmazonCognitoConnector;
import com.tmobile.pacman.api.admin.service.AwsS3BucketService;
import com.tmobile.pacman.api.admin.util.AdminUtils;

/**
 * Rule Service Implementations
 */
@Service
public class PolicyServiceImpl implements PolicyService {

	private static final String POLICY_PARAM_JSON = "{\"policyId\": \"%s\", \"params\": [%s]}";
	private static final String DATE_FORMAT = "MMM dd, YYYY";


	private static final Logger log = LoggerFactory.getLogger(PolicyServiceImpl.class);

	@Autowired
	private PacmanConfiguration config;

	@Autowired
	private AmazonClientBuilderService amazonClient;

	@Autowired
	private AwsS3BucketService awsS3BucketService;

	@Autowired
	private PolicyRepository policyRepository;
	@Autowired
	private PolicyParamsRepository policyParamsRepository;
	@Autowired
	private AccountsRepository accountsRepository;

	@Autowired
	private ObjectMapper mapper;
	
	@Value("${application.prefix}")
	private String applicationPrefix;

	@Autowired
	private PolicyCategoryRepository policyCategoryRepository;

	@Autowired
	private PolicyExemptionRepository policyExempRepository;

	@Autowired
	private  AmazonCognitoConnector amazonCognitoConnector;

	@Autowired
	private NotificationService notificationService;

	@Override
	public List<Policy> getAllPoliciesByTargetType(String targetType) {
		List<Policy> policies = policyRepository.findByTargetTypeIgnoreCase(targetType);
		policies.forEach(policy -> {
			Optional<List<PolicyParams>> policyParams = policyParamsRepository.findByPolicyId(policy.getPolicyId());
			if (policyParams.isPresent() && !policyParams.get().isEmpty()) {
				policy.setPolicyParams(generatePolicyParamJson(policy.getPolicyId(), policyParams.get()));
			}
		});
		return policies;
	}

	@Override
	public List<PolicyProjection> getAllPoliciesByTargetTypeName(String targetType) {
		return policyRepository.findByTargetType(targetType);
	}

	@Override
	public List<PolicyProjection> getAllPoliciesByTargetTypeAndNotInPolicyIdList(final String targetType,
			final List<String> policyIdList) {
		return policyRepository.findByTargetTypeAndPolicyIdNotIn(targetType, policyIdList);
	}

	@Override
	public List<PolicyProjection> getAllPoliciesByTargetTypeAndPolicyIdList(final String targetType,
			final List<String> policyIdList) {
		return policyRepository.findByTargetTypeAndPolicyIdIn(targetType, policyIdList);
	}

	@Override
	public Policy getByPolicyId(String policyId) {
		Policy policy = policyRepository.findByPolicyId(policyId);
		Optional<List<PolicyParams>> policyParams = policyParamsRepository.findByPolicyId(policy.getPolicyId());
		if (policyParams.isPresent() && !policyParams.get().isEmpty()) {
			policy.setPolicyParams(generatePolicyParamJson(policy.getPolicyId(), policyParams.get()));
		}
		List<PolicyExemption> policyExemptionList = policyExempRepository.findByPolicyID(policyId);
		policy.setPolicyExemption(policyExemptionList);
		if (policyExemptionList != null && !policyExemptionList.isEmpty()
				&& AdminConstants.DISABLED_CAPS.equals(policy.getStatus())) {
			PolicyExemption policyExemption = policyExemptionList.get(0);
			String createdByName=policyExemption.getCreatedBy();
			String[] parts=createdByName.split(",");
			createdByName=(parts.length == 2 && parts[0].equals(parts[1]))? parts[0]:parts[0] +" "+parts[1];
			policy.setDisableDesc(String.format(AdminConstants.POLICY_DISABLE_DESCRIPTION,
					createdByName, AdminUtils.getStringDate(DATE_FORMAT,
							addDays(policyExemption.getExpireDate(), 1))));
		}
		return policy;
	}

	@Override
	public Page<Policy> getPolicies(final String searchTerm, final int page, final int size) {
		Page<Policy> allPolicies = policyRepository.findAll(searchTerm.toLowerCase(), PageRequest.of(page, size));
		List<AccountDetails> onlineAccounts=accountsRepository.findByAccountStatus(AdminConstants.STATUS_CONFIGURED);
		if(onlineAccounts!=null && !onlineAccounts.isEmpty()){
			List<String> platformType = onlineAccounts.stream().map(AccountDetails::getPlatform).collect(Collectors.toList());
			List<Policy> policies= allPolicies.stream().filter(policy -> platformType.contains(policy.getAssetGroup())).collect(Collectors.toList());
			updatePolicyPluginType(policies,platformType);
			allPolicies=new PageImpl<>(policies);
		}
		allPolicies.stream().forEach(policy -> {
			Optional<List<PolicyParams>> policyParams = policyParamsRepository.findByPolicyId(policy.getPolicyId());
			if (policyParams.isPresent() && !policyParams.get().isEmpty()) {
				policy.setPolicyParams(generatePolicyParamJson(policy.getPolicyId(), policyParams.get()));
			}
		});
		return allPolicies;
	}

	private void updatePolicyPluginType(List<Policy> policies,List<String> enabledPluginTypes) {
			policies.removeIf(p->checkPolicyPlugin(p,enabledPluginTypes));
	}

	private boolean checkPolicyPlugin(Policy policy, List<String> enabledPluginTypes) {
		Optional<List<PolicyParams>> policyParams = policyParamsRepository.findByPolicyId(policy.getPolicyId());

		if (policyParams.isPresent() && !policyParams.get().isEmpty()) {
			PolicyParams policyParamPluginType = policyParams.get().stream()
					.filter(param -> param.getKey().equalsIgnoreCase("pluginType")).findFirst().orElse(null);
			if(policyParamPluginType!=null) {
				return !enabledPluginTypes.contains(policyParamPluginType.getValue());
			}
		}
		return false;
	}

	private String generatePolicyParamJson(String policyId, List<PolicyParams> policyParams) {
		String policyParamString = policyParams.stream().map(PolicyParams::paramsToJsonString)
				.collect(Collectors.joining(DELIMITER));
		return String.format(POLICY_PARAM_JSON, policyId, policyParamString);
	}

	@Override
	public Collection<String> getAllAlexaKeywords() {
		return policyRepository.getAllAlexaKeywords();
	}

	@Override
	public Collection<String> getAllPolicyIds() {
		return policyRepository.getAllPolicyIds();
	}

	@Override
	public String createPolicy(final MultipartFile fileToUpload, final CreateUpdatePolicyDetails policyDetails,
			final String userId) throws PacManException {
		checkPolicyTypeNotServerlessOrManaged(policyDetails, fileToUpload);
		return addPolicyInstance(fileToUpload, policyDetails, userId);
	}

	@Override
	public String updatePolicy(MultipartFile fileToUpload, CreateUpdatePolicyDetails updatePolicyDetails, String userId)
			throws PacManException {
		checkPolicyTypeNotServerlessOrManaged(updatePolicyDetails, fileToUpload);
		return updatePolicyInstance(fileToUpload, updatePolicyDetails, userId);
	}

	@Override
	public String invokePolicy(String policyId, List<Map<String, Object>> policyOptionalParams) {
		Policy policyDetails = policyRepository.findById(policyId).get();
		AWSLambda awsLambdaClient = amazonClient.getAWSLambdaClient(config.getRule().getLambda().getRegion());
		String invocationId = AdminUtils.getReferenceId();
		boolean invokeStatus = invokePolicy(awsLambdaClient, policyDetails, invocationId, policyOptionalParams);
		if (invokeStatus) {
			return invocationId;
		} else {
			return null;
		}
	}

	@Override
	public String enableDisablePolicy(final EnableDisablePolicy enableDisablePolicy, final String userId)
			throws PacManException {
		String policyId = enableDisablePolicy.getPolicyId();
		if (policyRepository.existsById(policyId)) {
			Policy existingPolicy = policyRepository.findById(policyId).get();
			PolicyExemption policyExemption = null;
			CognitoUserResponse user = amazonCognitoConnector.getCognitoUserDetails(userId);
			String currentUser = getUserName(user);
			if (enableDisablePolicy.getAction().equalsIgnoreCase(AdminConstants.ENABLED_CAPS)) {
				List<PolicyExemption> policyExemptionList = policyExempRepository.findByPolicyIDAndExpireDate(policyId,
						new Date());
				if (policyExemptionList != null && policyExemptionList.size() > 0) {
					policyExemption = policyExemptionList.get(0);
					policyExemption.setModifiedBy(currentUser);
					policyExemption.setModifiedOn(new Date());
					policyExemption.setStatus(AdminConstants.STATUS_CLOSE);
					existingPolicy.setStatus(AdminConstants.ENABLED_CAPS);
				} else {
					existingPolicy.setStatus(AdminConstants.ENABLED_CAPS);
				}
			} else {
				policyExemption = new PolicyExemption();
				try {
					policyExemption.setExpireDate(AdminUtils.getFormatedDate(AdminConstants.DEFAULT_DATE_FORMAT, enableDisablePolicy.getExpireDate()));
				} catch (ParseException e) {
					return AdminConstants.EXPIRE_DATE_FORMAT_EXCEPTION;
				}
				policyExemption.setId(UUID.randomUUID().toString());
				policyExemption.setPolicyID(policyId);
				policyExemption.setExemptionDesc(enableDisablePolicy.getDescription());
				policyExemption.setCreatedBy(currentUser);
				policyExemption.setCeatedOn(new Date());
				policyExemption.setStatus(AdminConstants.STATUS_OPEN);
				existingPolicy.setStatus(AdminConstants.DISABLED_CAPS);
			}
			updatePolicyStatus(existingPolicy, policyExemption);
			notificationService.triggerNotificationForEnableDisablePolicy(existingPolicy, policyExemption);
			return String.format(AdminConstants.POLICY_DISABLE_ENABLE_SUCCESS, enableDisablePolicy.getAction());

		} else {
			throw new PacManException(String.format(AdminConstants.POLICY_ID_NOT_EXITS, policyId));

		}
	}

	@Override
	public String enablePolicyForExpiredExemption(String policyUUID) throws PacManException {
		Policy existingPolicy = policyRepository.findPoicyTableByPolicyUUID(policyUUID);
		if (existingPolicy != null) {
			String policyId = existingPolicy.getPolicyId();
			existingPolicy.setStatus(AdminConstants.ENABLED_CAPS);
			PolicyExemption policyExemption = null;
				List<PolicyExemption> policyExemptionList = policyExempRepository.findByPolicyIDAndStatusOpen(existingPolicy.getPolicyId(), new Date());
				if (policyExemptionList != null && policyExemptionList.size() > 0) {
					policyExemption = policyExemptionList.get(0);
					policyExemption.setStatus(AdminConstants.STATUS_CLOSE);
					updatePolicyStatus(existingPolicy,policyExemption);
					return String.format(AdminConstants.POLICY_ENABLE_SUCCESS, policyId);
				}
				return String.format(AdminConstants.POLICY_EXEMPTION_ID_NOT_EXITS, policyId);
			
		} else {
			throw new PacManException(String.format(AdminConstants.POLICY_ID_NOT_EXITS, policyUUID));
		}
	}

	@Transactional
	private boolean updatePolicyStatus(Policy policy, PolicyExemption exemption) {
		policyRepository.save(policy);
		if(exemption != null) {
			policyExempRepository.save(exemption);
		}
		return true;
	}

	private String getUserName(CognitoUserResponse user) throws PacManException {
        if (Objects.isNull(user.getFirstName()) && Objects.isNull(user.getLastName())
                && (Objects.isNull(user.getEmail()) || user.getEmail().isEmpty()
                || !patternMatches(user.getEmail(), EMAIL_REGEX_PATTERN))) {
        	log.error(UNEXPECTED_ERROR_OCCURRED + INVALID_USER_ATTRIBUTES + user);
            throw new PacManException(UNEXPECTED_ERROR_OCCURRED + INVALID_USER_ATTRIBUTES + user);
        }

        if (Objects.isNull(user.getFirstName()) && Objects.isNull(user.getLastName())
                && !Objects.isNull(user.getEmail())) {
            String[] nameFromEmail = user.getEmail().substring(0, user.getEmail().indexOf(DELIMITER_AT))
                    .split(DELIMITER_DOT_REGEX, 2);
            user.setFirstName(nameFromEmail[0]);
            user.setLastName(nameFromEmail.length > 1 ? nameFromEmail[1] : nameFromEmail[0]);
        }
        if ((!Objects.isNull(user.getFirstName()) && Objects.isNull(user.getLastName()))) {
            user.setLastName(user.getFirstName());
        }
        return   StringUtils.capitalize(user.getFirstName()) + DELIMITER
                + StringUtils.capitalize(user.getLastName());
    }

	private static boolean patternMatches(String testString, String regexPattern) {
        return Pattern.compile(regexPattern)
                .matcher(testString)
                .matches();
    }
	private String getEventBus(String assetGroup) {
		String eventBus = "default";
		switch (assetGroup.toLowerCase()) {
		case "azure":
			String azureBusDetails = config.getAzure().getEventbridge().getBus().getDetails();
			eventBus = azureBusDetails.split(":")[0];
			break;
		case "gcp":
			String gcpBusDetails = config.getGcp().getEventbridge().getBus().getDetails();
			eventBus = gcpBusDetails.split(":")[0];
			break;
		case "aws":
			String awsBusDetails = config.getAws().getEventbridge().getBus().getDetails();
			eventBus = awsBusDetails.split(":")[0];
			break;
		default:
			eventBus = "default";
		}
		log.info("Event bridge bus : {} ", eventBus);
		return eventBus;
	}

	private String disableCloudWatchRule(Policy existingPolicy, String userId, RuleState ruleState)
			throws PacManException {
		String eventBusName = getEventBus(existingPolicy.getAssetGroup());
		DisableRuleRequest disableRuleRequest = new DisableRuleRequest().withName(existingPolicy.getPolicyUUID());
		disableRuleRequest.setEventBusName(eventBusName);
		DisableRuleResult disableRuleResult = amazonClient
				.getAmazonCloudWatchEvents(config.getRule().getLambda().getRegion()).disableRule(disableRuleRequest);
		if (disableRuleResult.getSdkHttpMetadata() != null) {
			if (disableRuleResult.getSdkHttpMetadata().getHttpStatusCode() == 200) {
				existingPolicy.setUserId(userId);
				existingPolicy.setModifiedDate(new Date());
				existingPolicy.setStatus(ruleState.name());
				policyRepository.save(existingPolicy);
				return String.format(AdminConstants.POLICY_DISABLE_ENABLE_SUCCESS, ruleState.name().toLowerCase());
			} else {
				throw new PacManException(CLOUDWATCH_RULE_DISABLE_FAILURE);
			}
		} else {
			throw new PacManException(CLOUDWATCH_RULE_DISABLE_FAILURE);
		}
	}

	private String enableCloudWatchRule(Policy existingPolicy, String userId, RuleState ruleState)
			throws PacManException {
		AWSLambda awsLambdaClient = amazonClient.getAWSLambdaClient(config.getRule().getLambda().getRegion());
		if (!checkIfPolicyAvailableForLambda(config.getRule().getLambda().getFunctionName(), awsLambdaClient)) {
			createPolicyForLambda(config.getRule().getLambda().getFunctionName(), awsLambdaClient);
		}
		String eventBusName = getEventBus(existingPolicy.getAssetGroup());

		EnableRuleRequest enableRuleRequest = new EnableRuleRequest().withName(existingPolicy.getPolicyUUID());
		enableRuleRequest.setEventBusName(eventBusName);
		EnableRuleResult enableRuleResult = amazonClient
				.getAmazonCloudWatchEvents(config.getRule().getLambda().getRegion()).enableRule(enableRuleRequest);
		if (enableRuleResult.getSdkHttpMetadata() != null) {
			if (enableRuleResult.getSdkHttpMetadata().getHttpStatusCode() == 200) {
				existingPolicy.setUserId(userId);
				existingPolicy.setModifiedDate(new Date());
				existingPolicy.setStatus(ruleState.name());
				policyRepository.save(existingPolicy);
				invokePolicy(awsLambdaClient, existingPolicy, null, null);
				return String.format(AdminConstants.POLICY_DISABLE_ENABLE_SUCCESS, ruleState.name().toLowerCase());
			} else {
				throw new PacManException(CLOUDWATCH_RULE_ENABLE_FAILURE);
			}
		} else {
			throw new PacManException(CLOUDWATCH_RULE_ENABLE_FAILURE);
		}
	}

	private void checkPolicyTypeNotServerlessOrManaged(CreateUpdatePolicyDetails policyDetails,
			MultipartFile fileToUpload) throws PacManException {
		if (isPolicyTypeNotServerlessOrManaged(policyDetails.getPolicyType()) && policyDetails.getIsFileChanged()) {
			if (fileToUpload.isEmpty()) {
				throw new PacManException(AdminConstants.JAR_FILE_MISSING);
			}
		}
	}

	private String updatePolicyInstance(final MultipartFile fileToUpload, CreateUpdatePolicyDetails policyDetails,
			String userId) throws PacManException {
		if (policyDetails != null) {
			if (isPolicyIdExits(policyDetails.getPolicyId())) {
				Date currentDate = new Date();
				Policy updatePolicyDetails = policyRepository.findById(policyDetails.getPolicyId()).get();
				updatePolicyParams(policyDetails.getPolicyParams(), policyDetails.getPolicyId());
				updatePolicyDetails.setSeverity(policyDetails.getSeverity());
				updatePolicyDetails.setCategory(policyDetails.getCategory());
				updatePolicyDetails.setAutoFixEnabled(policyDetails.getAutofixEnabled());
				if(policyDetails.getPolicyParams() != null && 
						policyDetails.getPolicyParams().indexOf(AdminConstants.AUTO_FIX_KEY) >= 0) {
					updatePolicyDetails.setAutoFixAvailable("true");
				} else {
					updatePolicyDetails.setAutoFixAvailable("false");
				}
				updatePolicyDetails.setAllowList(policyDetails.getAllowList());
				updatePolicyDetails.setWaitingTime(policyDetails.getWaitingTime());
				updatePolicyDetails.setMaxEmailNotification(policyDetails.getMaxEmailNotification());
				updatePolicyDetails.setTemplateName(policyDetails.getTemplateName());
				updatePolicyDetails.setTemplateColumns(policyDetails.getTemplateColumns());
				updatePolicyDetails.setFixType(policyDetails.getFixType());
				updatePolicyDetails.setWarningMailSubject(policyDetails.getWarningMailSubject());
				updatePolicyDetails.setWarningMessage(policyDetails.getWarningMessage());
				updatePolicyDetails.setFixMailSubject(policyDetails.getFixMailSubject());
				updatePolicyDetails.setFixMessage(policyDetails.getFixMessage());
				updatePolicyDetails.setViolationMessage(policyDetails.getViolationMessage());
				updatePolicyDetails.setElapsedTime(policyDetails.getElapsedTime());
				if (AdminConstants.MANAGED_POLICY_TYPE.equalsIgnoreCase(policyDetails.getPolicyType()))
				{
					updateCustomEventBridgeRule(updatePolicyDetails);
				} else {
					policyDetails.setTargetType(updatePolicyDetails.getTargetType());
					policyDetails.setDataSource(retrieveDataSource(updatePolicyDetails));
					updatePolicyDetails.setPolicyFrequency(policyDetails.getPolicyFrequency());
					updatePolicyDetails.setPolicyExecutable(policyDetails.getPolicyExecutable());
					updatePolicyDetails.setUserId(userId);
					updatePolicyDetails.setPolicyDisplayName(policyDetails.getPolicyDisplayName());
					updatePolicyDetails.setAssetGroup(policyDetails.getAssetGroup());
					updatePolicyDetails.setAlexaKeyword(policyDetails.getAlexaKeyword());
					updatePolicyDetails.setModifiedDate(currentDate);
					updatePolicyDetails.setPolicyType(policyDetails.getPolicyType());
					updatePolicyDetails.setPolicyRestUrl(policyDetails.getPolicyRestUrl());
					updatePolicyDetails.setPolicyDesc(policyDetails.getPolicyDesc());
					updatePolicyDetails.setResolution(policyDetails.getResolution());
					updatePolicyDetails.setResolutionUrl(policyDetails.getResolutionUrl());
					createUpdateCloudWatchEventRule(updatePolicyDetails);
					if (policyDetails.getIsFileChanged() && policyDetails.getPolicyType().equalsIgnoreCase("Classic")) {
						createUpdatePolicyJartoS3Bucket(fileToUpload, updatePolicyDetails.getPolicyUUID());
					}
				}
			} else {
				throw new PacManException(String.format(AdminConstants.POLICY_ID_NOT_EXITS,
						(policyDetails.getPolicyId() == null ? "given" : policyDetails.getPolicyId())));
			}
		} else {
			throw new PacManException("Invalid Policy Instance, please provide valid details.");
		}
		return AdminConstants.POLICY_CREATION_SUCCESS;
	}

	private void updatePolicyParams(String policyParamsString, String policyId) throws PacManException {
		try {
			Optional<List<PolicyParams>> policyParamsFromDBOptional = policyParamsRepository
					.findByPolicyIdAndIsEdit(policyId, Boolean.TRUE.toString());
			if (!policyParamsFromDBOptional.isPresent()) {
				/*this policy doesn't have editable params*/
				return;
			}
			final PolicyParamDetails policyParamDetails =
					mapper.readValue(policyParamsString, PolicyParamDetails.class);
			if (Objects.isNull(policyParamDetails) || Objects.isNull(policyParamDetails.getParams())
					|| policyParamDetails.getParams().isEmpty()) {
				/*since the params are empty, there is nothing to update*/
				return;
			}
			List<PolicyParams> latestPolicyParamsFiltered = policyParamDetails.getParams().stream().filter(
					param -> param.getIsEdit().equalsIgnoreCase(Boolean.TRUE.toString())).collect(Collectors.toList());
			if (latestPolicyParamsFiltered.isEmpty()) {
				/*params in request doesn't have editable fields*/
				return;
			}
			policyParamsFromDBOptional.get().forEach(paramFromDB -> {
				Optional<PolicyParams> latestPolicyParam = latestPolicyParamsFiltered.stream().filter(
						param -> param.getKey().equalsIgnoreCase(paramFromDB.getKey())).findAny();
				if (paramFromDB.getIsEdit().equalsIgnoreCase(Boolean.TRUE.toString()) &&
						latestPolicyParam.isPresent()) {
					paramFromDB.setValue(latestPolicyParam.get().getValue());
				}
			});
			/*only updates the value field of params with isEdit as true*/
			policyParamsRepository.saveAll(policyParamsFromDBOptional.get());
		} catch (Exception e) {
			log.error(String.format(AdminConstants.UNABLE_TO_UPDATE_POLICY_PARAMS, policyId), e);
			throw new PacManException(String.format(AdminConstants.UNABLE_TO_UPDATE_POLICY_PARAMS, policyId + e));
		}
	}

	private String retrieveDataSource(final Policy updatePolicyDetails) {
		Map<String, Object> policyParams;
		try {
			policyParams = mapper.readValue(updatePolicyDetails.getPolicyParams(),
					new TypeReference<Map<String, Object>>() {
					});
			return String.valueOf(policyParams.get("pac_ds"));
		} catch (Exception exception) {
			log.error(UNEXPECTED_ERROR_OCCURRED, exception);
			return StringUtils.EMPTY;
		}
	}

	private String addPolicyInstance(final MultipartFile fileToUpload, CreateUpdatePolicyDetails policyDetails,
			String userId) throws PacManException {
		if (policyDetails != null) {
			Date currentDate = new Date();
			if (!isPolicyIdExits(policyDetails.getPolicyId())) {
				Policy newPolicyDetails = new Policy();
				String policyUUID = UUID.randomUUID().toString();
				newPolicyDetails.setPolicyId(policyDetails.getPolicyId());
				newPolicyDetails.setPolicyName(policyDetails.getPolicyName());
				newPolicyDetails.setTargetType(policyDetails.getTargetType());
				newPolicyDetails.setPolicyParams(policyDetails.getPolicyParams());
				newPolicyDetails.setPolicyFrequency(policyDetails.getPolicyFrequency());
				newPolicyDetails.setPolicyExecutable(policyDetails.getPolicyExecutable());
				newPolicyDetails.setPolicyDisplayName(policyDetails.getPolicyDisplayName());
				newPolicyDetails.setPolicyDesc(policyDetails.getPolicyDesc());
				newPolicyDetails.setResolution(policyDetails.getResolution());
				newPolicyDetails.setResolutionUrl(policyDetails.getResolutionUrl());
				newPolicyDetails.setUserId(userId);
				newPolicyDetails.setStatus(RuleState.ENABLED.name().toUpperCase());
				newPolicyDetails.setAssetGroup(policyDetails.getAssetGroup());
				newPolicyDetails.setAlexaKeyword(policyDetails.getAlexaKeyword());
				newPolicyDetails.setCreatedDate(currentDate);
				newPolicyDetails.setModifiedDate(currentDate);
				newPolicyDetails.setPolicyUUID(policyUUID);
				newPolicyDetails.setPolicyType(policyDetails.getPolicyType());
				newPolicyDetails.setPolicyRestUrl(policyDetails.getPolicyRestUrl());
				newPolicyDetails.setSeverity(policyDetails.getSeverity());
				newPolicyDetails.setCategory(policyDetails.getCategory());
				newPolicyDetails.setAutoFixEnabled(policyDetails.getAutofixEnabled());
				if(policyDetails.getPolicyParams() != null && 
						policyDetails.getPolicyParams().indexOf(AdminConstants.AUTO_FIX_KEY) >= 0) {
					newPolicyDetails.setAutoFixAvailable("true");
				} else {
					newPolicyDetails.setAutoFixAvailable("false");
				}
				newPolicyDetails.setAllowList(policyDetails.getAllowList());
				newPolicyDetails.setWaitingTime(policyDetails.getWaitingTime());
				newPolicyDetails.setMaxEmailNotification(policyDetails.getMaxEmailNotification());
				newPolicyDetails.setTemplateName(policyDetails.getTemplateName());
				newPolicyDetails.setTemplateColumns(policyDetails.getTemplateColumns());
				newPolicyDetails.setFixType(policyDetails.getFixType());
				newPolicyDetails.setWarningMailSubject(policyDetails.getWarningMailSubject());
				newPolicyDetails.setWarningMessage(policyDetails.getWarningMessage());
				newPolicyDetails.setFixMailSubject(policyDetails.getFixMailSubject());
				newPolicyDetails.setFixMessage(policyDetails.getFixMessage());
				newPolicyDetails.setViolationMessage(policyDetails.getViolationMessage());
				newPolicyDetails.setElapsedTime(policyDetails.getElapsedTime());
				createUpdateCloudWatchEventRule(newPolicyDetails);
				if (policyDetails.getIsFileChanged() && policyDetails.getPolicyType().equalsIgnoreCase("Classic")) {
					createUpdatePolicyJartoS3Bucket(fileToUpload, policyUUID);
				}
			} else {
				throw new PacManException(String.format(AdminConstants.POLICY_ID_EXITS,
						(policyDetails.getPolicyId() == null ? "given" : policyDetails.getPolicyId())));
			}
		}  else {
			throw new PacManException("Invalid Policy Instance, please provide valid details.");
		}
		return AdminConstants.POLICY_CREATION_SUCCESS;
	}

	private void createUpdateCloudWatchEventRule(final Policy policyDetails) {
		try {

			AWSLambda awsLambdaClient = amazonClient.getAWSLambdaClient(config.getRule().getLambda().getRegion());

			if (!checkIfPolicyAvailableForLambda(config.getRule().getLambda().getFunctionName(), awsLambdaClient)) {
				createPolicyForLambda(config.getRule().getLambda().getFunctionName(), awsLambdaClient);
			}
			PutRuleRequest ruleRequest = new PutRuleRequest().withName(policyDetails.getPolicyUUID())
					.withDescription(policyDetails.getPolicyId());
			ruleRequest.withScheduleExpression("cron(".concat(policyDetails.getPolicyFrequency()).concat(")"));
			if (policyDetails.getStatus().equalsIgnoreCase(RuleState.ENABLED.name())) {
				ruleRequest.setState(RuleState.ENABLED);
			} else {
				ruleRequest.setState(RuleState.DISABLED);
			}
			PutRuleResult ruleResult = amazonClient.getAmazonCloudWatchEvents(config.getRule().getLambda().getRegion())
					.putRule(ruleRequest);
			String ruleArn = ruleResult.getRuleArn();
			if (ruleArn != null) {
				policyDetails.setPolicyArn(ruleArn);
				boolean isLambdaFunctionLinked = linkTargetWithRule(policyDetails);
				if (!isLambdaFunctionLinked) {
					// message.put(RuleConst.SUCCESS.getName(), false);
					// message.put(RuleConst.MESSAGE.getName(), "Unexpected Error Occured!");
				} else {
					policyRepository.save(policyDetails);
					invokePolicy(awsLambdaClient, policyDetails, null, null);
				}
			}

		} catch (Exception exception) {
			log.error(UNEXPECTED_ERROR_OCCURRED, exception);
		}
	}

	private void updateCustomEventBridgeRule(final Policy policyDetails) {
		try {

			AWSLambda awsLambdaClient = amazonClient.getAWSLambdaClient(config.getRule().getLambda().getRegion());
			String eventBridgeName = applicationPrefix+"-"+policyDetails.getAssetGroup();
			if (!checkIfPolicyAvailableForLambda(config.getRule().getLambda().getFunctionName(), awsLambdaClient)) {
				createPolicyForLambda(config.getRule().getLambda().getFunctionName(), awsLambdaClient);
			}
			if (policyDetails.getStatus().equalsIgnoreCase(RuleState.ENABLED.name())) {
				com.amazonaws.services.eventbridge.model.EnableRuleRequest enableRuleRequest = new com.amazonaws.services.eventbridge.model.EnableRuleRequest();
				enableRuleRequest.withEventBusName(eventBridgeName)
				.withName(policyDetails.getPolicyUUID());
				amazonClient.getAmazonEventBridgeClient(config.getRule().getLambda().getRegion()).enableRule(enableRuleRequest);
			}else {
				com.amazonaws.services.eventbridge.model.DisableRuleRequest disableRuleRequest = new com.amazonaws.services.eventbridge.model.DisableRuleRequest();
				disableRuleRequest.withEventBusName(eventBridgeName)
				.withName(policyDetails.getPolicyUUID());
				amazonClient.getAmazonEventBridgeClient(config.getRule().getLambda().getRegion()).disableRule(disableRuleRequest);
				
			}
			DescribeRuleRequest describeRuleRequest = new DescribeRuleRequest();
			describeRuleRequest.withEventBusName(eventBridgeName)
			.withName(policyDetails.getPolicyUUID());
			DescribeRuleResult describeRule = amazonClient.getAmazonEventBridgeClient(config.getRule().getLambda().getRegion()).describeRule(describeRuleRequest);
			String arn = describeRule.getArn();
			if (arn != null) {
				policyDetails.setPolicyArn(arn);
				boolean isLambdaFunctionLinked = linkTargetWithRuleForManagedPolicy(policyDetails,eventBridgeName);
				if (!isLambdaFunctionLinked) {
					// message.put(RuleConst.SUCCESS.getName(), false);
					// message.put(RuleConst.MESSAGE.getName(), "Unexpected Error Occured!");
				} else {
					policyRepository.save(policyDetails);
					invokePolicy(awsLambdaClient, policyDetails, null, null);
				}
			}

		} catch (Exception exception) {
			log.error(UNEXPECTED_ERROR_OCCURRED, exception);
		}
	}

	@Override
	public Map<String, Object> invokeAllPolicies(List<String> polocyIds) {
		AWSLambda awsLambdaClient = amazonClient.getAWSLambdaClient(config.getRule().getLambda().getRegion());
		Map<String, Object> responseLists = Maps.newHashMap();
		List<String> successList = Lists.newArrayList();
		List<String> failedList = Lists.newArrayList();
		for (String policyId : polocyIds) {
			Policy ruleInstance = policyRepository.findById(policyId).get();
			boolean isInvoked = invokePolicy(awsLambdaClient, ruleInstance, null, Lists.newArrayList());
			if (isInvoked) {
				successList.add(policyId);
			} else {
				failedList.add(policyId);
			}
		}
		responseLists.put("successList", successList);
		responseLists.put("failedList", failedList);
		return responseLists;
	}

	private boolean invokePolicy(AWSLambda awsLambdaClient, Policy policyDetails, String invocationId,
			List<Map<String, Object>> additionalRuleParams) {
		JsonObject inputConstant = new JsonObject();
		inputConstant.addProperty(AdminConstants.POLICY_UUID, policyDetails.getPolicyUUID());		
		if (invocationId != null) {
			inputConstant.addProperty(AdminConstants.INVOCATION_ID, invocationId);
		}
		String functionName = config.getRule().getLambda().getFunctionName();
		ByteBuffer payload = ByteBuffer.wrap(inputConstant.toString().getBytes());
		InvokeRequest invokeRequest = new InvokeRequest().withFunctionName(functionName).withPayload(payload);
		InvokeResult invokeResult = awsLambdaClient.invoke(invokeRequest);
		if (invokeResult.getStatusCode() == 200) {
			return true;
		} else {
			return false;
		}
	}

	private boolean linkTargetWithRule(final Policy policy) {
		JsonObject obj = new JsonObject();
		obj.addProperty(AdminConstants.POLICY_UUID, policy.getPolicyUUID());
		Target target = new Target().withId(config.getRule().getLambda().getTargetId())
				.withArn(config.getRule().getLambda().getFunctionArn()).withInput(obj.toString());

		PutTargetsRequest targetsRequest = new PutTargetsRequest().withTargets(target).withRule(policy.getPolicyUUID());

		try {
			PutTargetsResult targetsResult = amazonClient
					.getAmazonCloudWatchEvents(config.getRule().getLambda().getRegion()).putTargets(targetsRequest);
			return (targetsResult.getFailedEntryCount() == 0);
		} catch (Exception exception) {
			return false;
		}
	}

	private boolean linkTargetWithRuleForManagedPolicy(final Policy policy, String eventBridge) {
		JsonObject obj = new JsonObject();
		obj.addProperty(AdminConstants.POLICY_UUID, policy.getPolicyUUID());
		com.amazonaws.services.eventbridge.model.Target eventTarget = new com.amazonaws.services.eventbridge.model.Target();
		eventTarget.withArn(config.getRule().getLambda().getFunctionArn())
				.withId(config.getRule().getLambda().getTargetId()).withInput(obj.toString());
		com.amazonaws.services.eventbridge.model.PutTargetsRequest targetReq = new com.amazonaws.services.eventbridge.model.PutTargetsRequest();
		targetReq.withTargets(eventTarget).withEventBusName(eventBridge).withRule(policy.getPolicyUUID());

		try {
			com.amazonaws.services.eventbridge.model.PutTargetsResult putTargetResult = amazonClient
					.getAmazonEventBridgeClient(config.getRule().getLambda().getRegion()).putTargets(targetReq);
			return (putTargetResult.getFailedEntryCount() == 0);
		} catch (Exception exception) {
			return false;
		}
	}

	private void createPolicyForLambda(final String lambdaFunctionName, final AWSLambda lambdaClient) {
		AddPermissionRequest addPermissionRequest = new AddPermissionRequest().withFunctionName(lambdaFunctionName)
				.withPrincipal(config.getRule().getLambda().getPrincipal())
				.withStatementId("sid-".concat(config.getRule().getLambda().getTargetId()))
				.withAction(config.getRule().getLambda().getActionEnabled());
		lambdaClient.addPermission(addPermissionRequest);
	}

	private static boolean checkIfPolicyAvailableForLambda(final String lambdaFunctionName,
			final AWSLambda lambdaClient) {
		try {
			GetPolicyRequest getPolicyRequest = new GetPolicyRequest();
			getPolicyRequest.setFunctionName(lambdaFunctionName);
			lambdaClient.getPolicy(getPolicyRequest);
			return true;
		} catch (ResourceNotFoundException resourceNotFoundException) {
			if (resourceNotFoundException.getStatusCode() == 404) {
				return false;
			}
		}
		return false;
	}

	private boolean isPolicyTypeNotServerlessOrManaged(final String policyType) {
		String policyTypeToCheck = policyType.replace(" ", StringUtils.EMPTY);
		return (!policyTypeToCheck.equalsIgnoreCase(AdminConstants.SERVERLESS_RULE_TYPE)
				&& !policyTypeToCheck.equalsIgnoreCase(AdminConstants.MANAGED_POLICY_TYPE));
	}

	private boolean createUpdatePolicyJartoS3Bucket(MultipartFile fileToUpload, String ruleUUID) {
		// @Todo folder name hard coded.
		return awsS3BucketService.uploadFile(amazonClient.getAmazonS3(config.getRule().getS3().getBucketRegion()),
				fileToUpload, config.getJob().getS3().getBucketName() + "/pacbot", ruleUUID.concat(".jar"));
	}

	public boolean isPolicyIdExits(String policyId) {
		return policyRepository.findByPolicyId(policyId) != null;
	}

	@Override
	public List<PolicyCategory> getAllPolicyCategories() throws PacManException {
		return policyCategoryRepository.findAll();
	}
	
	@Override
	public String enableDisableAutofix(final String policyId, final String action, final String userId)
			throws PacManException {
		Optional<Policy> policyById = policyRepository.findById(policyId);
		if (policyById.isPresent()) {
			Policy existingPolicy = policyById.get();
			existingPolicy.setUserId(userId);
			existingPolicy.setModifiedDate(new Date());
			existingPolicy.setAutoFixEnabled(action);
			policyRepository.save(existingPolicy);
			if(action != null && "true".equalsIgnoreCase(action)) {
				return AdminConstants.AUTOFIX_ENABLE_SUCCESS; 
			}
			return AdminConstants.AUTOFIX_DISABLE_SUCCESS; 
		} else {
			throw new PacManException(String.format(AdminConstants.POLICY_ID_NOT_EXITS, policyId));
		}
	}

}
